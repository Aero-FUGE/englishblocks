import React, {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import {cloudSync} from '../utils/cloudSync';
import type {LevelData, WordBlock} from '../types/game';
type Message={role:'user'|'assistant';content:string};
export function MimiChat({level,phase,slots,matches,correct,onLogin,fallback}:{level:LevelData;phase:number;slots:(WordBlock|null)[];matches:boolean[];correct:boolean;onLogin:()=>void;fallback:string}){
 const cloud=useSyncExternalStore(cloudSync.subscribe,cloudSync.getState);
 const [open,setOpen]=useState(false),[auto,setAuto]=useState(()=>localStorage.getItem('englishblocks_mimi_auto')==='true');
 const [messages,setMessages]=useState<Message[]>([]),[input,setInput]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reply,setReply]=useState('');
 const signature=JSON.stringify(slots.map(w=>w?.id||null));
 const latest=useRef({slots,matches,correct,signature});latest.current={slots,matches,correct,signature};
 useEffect(()=>{document.documentElement.dataset.mimiChatOpen=String(open);return()=>{delete document.documentElement.dataset.mimiChatOpen;};},[open]);
 const panel=useRef<HTMLElement>(null);
 const [dismissed,setDismissed]=useState('');
 useEffect(()=>{if(!open)return;const frame=requestAnimationFrame(()=>{const log=panel.current?.querySelector<HTMLElement>('[role=log]');if(log)log.scrollTop=log.scrollHeight;});return()=>cancelAnimationFrame(frame);},[messages,open]);
 useEffect(()=>{if(!open)return;const el=panel.current;if(!el)return;const measure=()=>document.documentElement.style.setProperty('--mimi-panel-height',`${el.getBoundingClientRect().height}px`);const observer=new ResizeObserver(measure);observer.observe(el);measure();if(innerWidth<1280)document.querySelector('[data-eb-edit=board]')?.scrollIntoView({behavior:'smooth',block:'start'});return()=>{observer.disconnect();document.documentElement.style.removeProperty('--mimi-panel-height');};},[open]);
 const history=useRef<Message[]>([]),request=useRef(0),inFlight=useRef(false),last=useRef(0),failed=useRef(''),lastAuto=useRef('');
 const stalled=useRef(0),prior=useRef({signature,matches});
 const mounted=useRef(true),account=useRef(cloud.user?.id);account.current=cloud.user?.id;
 useEffect(()=>{mounted.current=true;const show=()=>{setOpen(v=>!v);};window.addEventListener('englishblocks-open-mimi',show);return()=>{mounted.current=false;request.current++;window.removeEventListener('englishblocks-open-mimi',show);};},[]);
 useEffect(()=>{request.current++;history.current=[];setMessages([]);setReply('');setError('');},[cloud.user?.id]);
 useEffect(()=>{
  if(prior.current.signature!==signature){
   const improved=matches.some((m,i)=>m&&!prior.current.matches[i]);
   stalled.current=improved?0:Math.min(10000,stalled.current+1);
   prior.current={signature,matches};
   // Never leave an old translation attached to a new word order.
   setReply('');
  }
 },[signature,matches]);
 async function ask(kind:'chat'|'translate'|'hint'|'celebrate',question=''){
  if(!account.current){onLogin();return;}
  if(inFlight.current)return;
  const current=latest.current,stamp=current.signature,user=account.current,id=++request.current;
  const turns:Message[]=question?[...history.current.slice(-6),{role:'user',content:question}]:history.current.slice(-6);
  const phaseData=level.tieredAssembly?.phases[phase];
  inFlight.current=true;setBusy(true);setError('');last.current=Date.now();
  try{
   const result=await cloudSync.askMimi({kind,messages:turns,context:{prompt:phaseData?.targetChinese||level.targetChinese,target:phaseData?.targetEnglish||level.targetEnglish,slots:current.slots.map(w=>w?.text||null),correct:current.correct,stalled:stalled.current}});
   if(!mounted.current||id!==request.current||account.current!==user)return;
   if(typeof result.reply!=='string'||!result.reply.trim())throw Error('咪咪没收到完整回复，请重试');
   if(kind!=='chat'&&latest.current.signature!==stamp)return;
   if(kind==='chat'){
    const updated=[...turns,{role:'assistant' as const,content:result.reply}].slice(-10);history.current=updated;setMessages(updated);setInput('');setReply(result.reply);
   }else {setReply(result.reply);lastAuto.current=stamp;}
  }catch(e){if(mounted.current&&id===request.current){failed.current=stamp;setError(e instanceof Error?e.message:'咪咪暂时走神了，请重试');}}
  finally{inFlight.current=false;if(mounted.current){setBusy(false);}}
 }
 useEffect(()=>{
  if(!auto||!cloud.user||busy||!slots.some(Boolean)||failed.current===signature||lastAuto.current===signature)return;
  const timer=setTimeout(()=>{void ask(correct?'celebrate':stalled.current>=3?'hint':'translate');},Math.max(2200,12000-(Date.now()-last.current)));
  return()=>clearTimeout(timer);
 },[auto,cloud.user?.id,signature,correct,busy]);
 const toggle=()=>{setAuto(v=>{localStorage.setItem('englishblocks_mimi_auto',String(!v));failed.current='';return !v;});};
 const speech=reply||fallback;
 const bubbleToken=busy?'thinking':error||speech;
 return <>
  {!open&&bubbleToken&&dismissed!==bubbleToken&&<aside className="eb-mimi-bubble" aria-label="咪咪陪聊气泡" onPointerDown={e=>e.stopPropagation()}>
   <div className="eb-mimi-header"><strong>咪咪翻译官</strong><button type="button" aria-label="收起咪咪气泡" onClick={()=>setDismissed(bubbleToken)}>×</button></div>
   <p aria-live="polite" className="eb-mimi-bubble-text">{busy?'咪咪正在想一想喵…':error?'咪咪暂时连不上 AI，点我查看详情喵。':speech}</p>
   <button type="button" onClick={()=>setOpen(true)} className="text-xs underline">{error?'查看 / 重试':'问问咪咪 ♡'}</button>
  </aside>}
  {open&&createPortal(<section onPointerDown={e=>e.stopPropagation()} ref={panel} id="mimi-ai" className="eb-mimi-chat eb-mimi-dock" aria-label="咪咪 AI 翻译官">
  <div className="eb-mimi-header"><strong>🐱 咪咪翻译官</strong><button type="button" aria-label="收起咪咪对话" onClick={()=>setOpen(false)}>收起 ×</button></div>
  <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={auto} onChange={toggle}/>自动陪聊 · 拼词时用气泡回应</label>
  {reply&&messages.at(-1)?.content!==reply&&<p className="eb-mimi-reply" aria-live="polite">{reply}</p>}
  {busy&&<p className="text-xs py-2" role="status">咪咪正在捋顺小胡须，想一想喵…</p>}
  {error&&<p className="text-xs py-2 text-amber-800" role="alert">{error} <button disabled={busy} onClick={()=>void ask('translate')} className="underline">重试</button></p>}
  <div className="space-y-2 pt-2 eb-mimi-content">
   <p className="text-xs text-[#7C8975]">AI 会参考当前题目和拼法，可能说错。轻轻吐槽句子，也陪你进步喵！</p>
   {!cloud.user?<button className="eb-cloud-secondary" onClick={onLogin}>登录云账号，和咪咪聊天</button>:<>
    <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={()=>void ask('translate')}>翻译我的拼法</button><button disabled={busy} onClick={()=>void ask('hint')}>给一点点提示</button><button disabled={busy} onClick={()=>void ask('chat','我有点卡住了，可以鼓励我一下吗？')}>求鼓励 ♡</button></div>
    <div className="eb-mimi-history" role="log" aria-label="与咪咪的对话">{messages.map((m,i)=><p key={i} className={m.role==='user'?'eb-mimi-user':'eb-mimi-reply'}><strong>{m.role==='user'?'我：':'咪咪：'}</strong>{m.content}</p>)}</div>
    <form className="flex gap-2" onSubmit={e=>{e.preventDefault();if(input.trim())void ask('chat',input.trim());}}><input aria-label="问咪咪一个问题" maxLength={600} value={input} onChange={e=>setInput(e.target.value)} placeholder="这个词怎么用？为什么要放这里？" className="min-w-0 flex-1 rounded-xl border bg-white px-3 py-2 text-sm"/><button type="submit" disabled={busy||!input.trim()} className="eb-cloud-primary">发送</button></form>
   </>}
  </div>
 </section>,document.body)}
 </>;
}
