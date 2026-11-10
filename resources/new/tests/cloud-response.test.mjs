import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readCloudResponse, CloudApiError } from '../shared/cloud-response.mjs';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8'}});

test('empty and interrupted replies give actionable errors, never an API auth error',async()=>{
 for(const status of [200,401,502,503]){
  await assert.rejects(readCloudResponse(new Response('',{status}),'/save'),e=>!(e instanceof CloudApiError)&&e.message.includes('空内容')&&e.message.includes('本机记录已保留'));
 }
 await assert.rejects(readCloudResponse(new Response('{"revision":',{headers:{'Content-Type':'application/json'}}),'/save'),/响应不完整/);
 const broken={status:200,text:async()=>{throw Error('stream interrupted');}};
 await assert.rejects(readCloudResponse(broken,'/save'),/响应中断/);
});
test('HTML pages, redirects, null and malformed successful replies are not accepted',async()=>{
 await assert.rejects(readCloudResponse(new Response('<html>Sign in</html>',{headers:{'Content-Type':'text/html'}}),'/login'),/不是云接口/);
 await assert.rejects(readCloudResponse({status:200,ok:true,redirected:true,headers:new Headers({'Content-Type':'application/json'}),text:async()=>'{"ok":true}'},'/login'),/不是云接口/);
 for(const value of [null,[],{}, {revision:1,snapshot:null}])await assert.rejects(readCloudResponse(json(value),'/save'));
 await assert.rejects(readCloudResponse(json({token:'invalid'}),'/login'),/登录响应不完整/);
});
test('valid JSON errors preserve their status; valid login and empty cloud save still work',async()=>{
 await assert.rejects(readCloudResponse(json({error:'请重新登录'},401),'/save'),e=>e instanceof CloudApiError&&e.status===401);
 await assert.rejects(readCloudResponse(json({revision:0,snapshot:null},409),'/save'),e=>e instanceof CloudApiError&&e.status===409&&e.data.revision===0);
 assert.deepEqual(await readCloudResponse(json({revision:0,snapshot:null}),'/save'),{revision:0,snapshot:null});
 const session={token:'a'.repeat(43),expiresAt:Date.now()+10000,user:{id:'test-account',username:'tester'}};
 assert.deepEqual(await readCloudResponse(json(session),'/login'),session);
 assert.deepEqual(await readCloudResponse(json({ok:true}),'/logout'),{ok:true});
});
