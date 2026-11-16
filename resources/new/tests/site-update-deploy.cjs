// Local Docker integration only; never connects to the live website.
const {execFileSync}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'eb-site-update-')),name='eb-site-smoke-'+Date.now(),volume=name+'-data',port=43123;
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const api=async(route,body,token,method=body?'POST':'GET')=>{const r=await fetch(`http://127.0.0.1:${port}/api/cloud`+route,{method,headers:{Connection:'close','Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});assert(r.ok,route+' '+r.status);return r.json();};
(async()=>{try{
 docker('run','-d','--name',name,'-p',`127.0.0.1:${port}:3000`,'-v',volume+':/data','-e','DEEPSEEK_API_KEY=smoke-key-not-real','englishblocks:server-20261113-bb5072f');
 for(let i=0;i<30;i++){try{await api('/health');break;}catch{await new Promise(r=>setTimeout(r,500));}}
 const auth=await api('/register',{username:'update_smoke',password:'UpdateSmoke2026!'});
 const snapshot={profile:{id:'user_main',name:'原账号',avatar:'cat-avatar-05',themeColor:'green',currentLevelIndex:2,completedLevelIds:[1],masteredWordIds:[],starredWordIds:[],mistakeHistory:[],streakDays:1,totalAttempts:1,correctAttempts:1,totalWordGoal:2004,totalSentenceGoal:1190},collection:{fish:777,activeCat:'mimi',owned:[],equipped:{mimi:{},tuanzhang:{}},bestHints:{}}};
 await api('/save',{expectedRevision:0,snapshot},auth.token,'PUT');
 const env={...process.env,ENGLISHBLOCKS_CONTAINER:name,ENGLISHBLOCKS_PORT:String(port),ENGLISHBLOCKS_UI_UPDATE_DIR:path.join(root,'releases'),ENGLISHBLOCKS_UI_UPDATE_URL:'http://127.0.0.1:4180'};
 const apply=path.resolve(__dirname,'../deploy/server-update/apply-site-update.sh');
 const output=execFileSync('bash',[apply],{env,encoding:'utf8',stdio:['ignore','pipe','pipe']});assert(output.includes('网站更新成功'));
 assert.deepEqual((await api('/save',undefined,auth.token)).snapshot,snapshot);assert((await api('/login',{username:'update_smoke',password:'UpdateSmoke2026!'})).token);
 assert.equal(docker('exec',name,'node','-e','process.stdout.write(String(process.env.DEEPSEEK_API_KEY==="smoke-key-not-real"))'),'true');
 assert.equal(docker('exec',name,'node','-e','console.log(require("/app/server/social-catalog.json").levels.filter(l=>l.tier===5).length)'),'30');
 const index=await (await fetch(`http://127.0.0.1:${port}/`,{headers:{Connection:'close'}})).text();assert(index.includes('index-CuSD4WUf.js'));assert(index.includes('宁ICP备2026004648号'));
 const broken=path.join(root,'rollback.sh');fs.writeFileSync(broken,fs.readFileSync(apply,'utf8').replace("grep -Fq 'index-CuSD4WUf.js' served-index.html","grep -Fq 'intentionally-absent-smoke-bundle.js' served-index.html"));
 let failed=false;try{execFileSync('bash',[broken],{env,encoding:'utf8',stdio:['ignore','pipe','pipe']});}catch(e){failed=true;assert(String(e.stdout).includes('原网站已恢复'));}assert(failed);
 assert.deepEqual((await api('/save',undefined,auth.token)).snapshot,snapshot);assert.equal((await(await fetch(`http://127.0.0.1:${port}/`,{headers:{Connection:'close'}})).text()),index);
 console.log('PASS Docker in-place update and forced rollback: original account/login/session/save/fish/API configuration intact; 30 fifth-stage lessons and filing footer verified.');
 }catch(e){try{console.error(docker('logs','--tail','12',name));}catch{}throw e;}finally{try{docker('rm','-f',name);}catch{}try{docker('volume','rm',volume);}catch{}fs.rmSync(root,{recursive:true,force:true});}})().catch(e=>{console.error(e.stack);process.exit(1)});
