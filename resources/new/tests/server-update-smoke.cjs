// Real Docker integration check; uses only isolated test containers and a disposable named volume.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync,spawn}=require('node:child_process');const express=require('express');
const artifacts=path.resolve('../../deployment/server-20261113-bb5072f');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'eb-update-smoke-')),name='eb-update-smoke-'+process.pid,volume=name+'-data',fixture=name+':fixture';
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});
(async()=>{const assert=require('node:assert/strict');let http;
try{
 const stage=path.join(artifacts,'app');fs.writeFileSync(path.join(stage,'Dockerfile.fixture'),`FROM node:24-bookworm-slim\nWORKDIR /app\nENV CLOUD_DATA_DIR=/data NODE_ENV=production PORT=3000\nRUN npm install --omit=dev --ignore-scripts --no-audit --no-fund express@4.21.2 dotenv@17.2.3 && mkdir /data && chown node:node /data\nCOPY server/ ./server/\nCOPY shared/ ./shared/\nRUN mkdir dist && echo BEFORE-UPDATE > dist/index.html\nUSER node\nVOLUME ["/data"]\nCMD ["node","server/start.cjs"]\n`);
 docker('build','-f',path.join(stage,'Dockerfile.fixture'),'-t',fixture,stage);docker('volume','create',volume);
 docker('run','-d','--name',name,'-p','127.0.0.1::3000','-v',volume+':/data','-e','DEEPSEEK_API_KEY=deployment-smoke-not-a-real-key',fixture);
 const port=JSON.parse(docker('inspect',name))[0].NetworkSettings.Ports['3000/tcp'][0].HostPort,url='http://127.0.0.1:'+port;
 for(let i=0;i<30;i++){try{if((await fetch(url+'/api/cloud/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 const api=async(p,method='GET',body,token)=>{const r=await fetch(url+'/api/cloud'+p,{method,headers:{'Content-Type':'application/json',Connection:'close',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const j=await r.json();assert(r.ok,JSON.stringify(j));return j;};
 const user=await api('/register','POST',{username:'deployment_cat',password:'DeploymentTest123!'});
 const snapshot={profile:{id:'user_main',name:'部署测试猫',avatar:'cat-avatar-01',themeColor:'green',currentLevelIndex:0,totalAttempts:0,correctAttempts:0,streakDays:0,totalWordGoal:1200,totalSentenceGoal:500,completedLevelIds:[],masteredWordIds:[],starredWordIds:[],mistakeHistory:[]},collection:{fish:177,activeCat:'mimi',owned:[],equipped:{mimi:{},tuanzhang:{}},bestHints:{}}};
 await api('/save','PUT',{expectedRevision:0,snapshot},user.token);
 const app=express();app.use(express.static(artifacts));http=app.listen(0,'127.0.0.1');await new Promise(r=>http.once('listening',r));
 const run=script=>new Promise(resolve=>{const child=spawn('bash',[script],{env:{...process.env,ENGLISHBLOCKS_UPDATE_URL:'http://127.0.0.1:'+http.address().port,ENGLISHBLOCKS_CONTAINER:name,ENGLISHBLOCKS_PORT:port,ENGLISHBLOCKS_RELEASE_DIR:path.join(temp,'releases')}});let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);child.on('close',code=>{fs.writeFileSync(path.join(temp,'last-run.log'),output);resolve({code,output});});});
 const script=path.resolve('deploy/server-update/update-server.sh');let result=await run(script);assert.equal(result.code,0,result.output.slice(-3000));
 assert.equal((await api('/save','GET',undefined,user.token)).snapshot.collection.fish,177);
 assert((await (await fetch(url)).text()).includes('index-Bl_nD0XC.js'));
 docker('exec',name,'node','-e','if(process.env.DEEPSEEK_API_KEY!=="deployment-smoke-not-a-real-key")process.exit(1)');
 const backups=fs.readdirSync(path.join(temp,'releases')).map(p=>path.join(temp,'releases',p,'backup/data.tar.gz')).filter(p=>fs.existsSync(p));assert.equal(backups.length,1);
 assert(!result.output.includes('deployment-smoke-not-a-real-key'));console.log('PASS: real Docker update, missing audio fallback, preserved accounts/session/save/API environment, database backup and current frontend.');
 result=await run(script);assert.equal(result.code,0,result.output.slice(-2000));assert(result.output.includes('无需重复更新'));console.log('PASS: repeated installer exits without another deployment or duplicate backup.');
 // Verify a failing new image rolls back to the retained working container.
 const badDir=path.join(temp,'bad');fs.mkdirSync(badDir);execFileSync('tar',['-xzf',path.join(artifacts,'englishblocks-web.tar.gz'),'-C',badDir]);fs.writeFileSync(path.join(badDir,'server/start.cjs'),'process.exit(73);\n');const badPackage=path.join(artifacts,'smoke-bad.tar.gz');execFileSync('tar',['-czf',badPackage,'-C',badDir,'dist','server','shared','Dockerfile.update','VERSION.json','audio-manifest.json']);const originalSums=fs.readFileSync(path.join(artifacts,'SHA256SUMS'),'utf8');
 const failScript=path.join(temp,'failure.sh');fs.writeFileSync(failScript,fs.readFileSync(script,'utf8').replace("RELEASE='server-20261113-bb5072f'","RELEASE='smoke-rollback-test'").replace('fetch englishblocks-web.tar.gz','fetch smoke-bad.tar.gz').replace('verify englishblocks-web.tar.gz','verify smoke-bad.tar.gz').replace('extract englishblocks-web.tar.gz','extract smoke-bad.tar.gz'));
 fs.appendFileSync(path.join(artifacts,'SHA256SUMS'),crypto.createHash('sha256').update(fs.readFileSync(badPackage)).digest('hex')+'  smoke-bad.tar.gz\n');
 try{result=await run(failScript);assert.notEqual(result.code,0);assert(result.output.includes('恢复旧容器'));assert.equal((await api('/save','GET',undefined,user.token)).snapshot.collection.fish,177);docker('exec',name,'node','-e','if(process.env.DEEPSEEK_API_KEY!=="deployment-smoke-not-a-real-key")process.exit(1)');console.log('PASS: failed new image automatically restores the previous working container and preserves data/environment.');}finally{fs.writeFileSync(path.join(artifacts,'SHA256SUMS'),originalSums);fs.rmSync(badPackage,{force:true});}
}finally{
 if(http){http.closeAllConnections();await new Promise(r=>http.close(r));}
 const containers=docker('ps','-a','--format','{{.Names}}').trim().split('\n').filter(n=>n===name||n.startsWith(name+'-previous-'));for(const n of containers)try{docker('rm','-f',n);}catch{}
 try{docker('volume','rm',volume);}catch{}
 fs.rmSync(temp,{recursive:true,force:true});
}})().catch(e=>{console.error(e);process.exitCode=1;});
