import {useCallback,useEffect,useRef,useState} from 'react';
import {socialRequest,type PrankNotice,type Wallet} from './social';
import {cloudSync} from './cloudSync';
import type {WordBlock} from '../types/game';
type Ticket={attemptId:string;nextPhase:number;readyAt:number};
export function useSocialActivity(userId:string|undefined,levelId:number){
 const [inbox,setInbox]=useState<PrankNotice[]>([]),[pending,setPending]=useState(0),[wallet,setWallet]=useState<Wallet|null>(null),[learningError,setLearningError]=useState('');
 const account=useRef(userId);account.current=userId;
 type Queue={owner:string;level:number;ticket:Promise<Ticket>|null;submissions:Map<number,string[]>;running:boolean};
 const tickets=useRef(new Map<string,Queue>());
 const retry=useRef<(()=>Promise<void>)|null>(null);
 const refresh=useCallback(async()=>{if(!userId||document.hidden)return;try{const result=await socialRequest<{inbox:PrankNotice[];pendingCount:number;wallet:Wallet}>('/social/notifications');if(account.current!==userId)return;setInbox(result.inbox);setPending(result.pendingCount);setWallet(result.wallet);}catch{/* Learning and local saves continue when the network is unavailable. */}},[userId]);
 useEffect(()=>{setInbox([]);setPending(0);setWallet(null);setLearningError('');retry.current=null;tickets.current.clear();},[userId]);
 useEffect(()=>{if(!userId)return;void refresh();const timer=setInterval(()=>void refresh(),60000);const wake=()=>void refresh();window.addEventListener('englishblocks-social-refresh',wake);window.addEventListener('online',wake);document.addEventListener('visibilitychange',wake);return()=>{clearInterval(timer);window.removeEventListener('englishblocks-social-refresh',wake);window.removeEventListener('online',wake);document.removeEventListener('visibilitychange',wake);};},[refresh,userId]);
 const start=useCallback((id:number)=>{
  const key=userId+':'+id;let entry=tickets.current.get(key);
  if(!entry){entry={owner:userId!,level:id,ticket:null,submissions:new Map(),running:false};tickets.current.set(key,entry);}
  if(!entry.ticket){const target=entry;target.ticket=socialRequest<Ticket>('/learning/start','POST',{levelId:id});target.ticket.catch(()=>{target.ticket=null;});}
  return entry;
 },[userId]);
 useEffect(()=>{if(userId)start(levelId);},[userId,levelId,start]);
 const drain=async(entry:Queue)=>{
  if(entry.running)return;entry.running=true;
  try{
   if(!entry.ticket){entry.ticket=socialRequest<Ticket>('/learning/start','POST',{levelId:entry.level});entry.ticket.catch(()=>{entry.ticket=null;});}
   let ticket=await entry.ticket;
   while(entry.submissions.has(ticket.nextPhase)){
    if(account.current!==entry.owner||cloudSync.getState().user?.id!==entry.owner)throw Error('账号已切换');
    const phase=ticket.nextPhase,wordIds=entry.submissions.get(phase)!;
    await new Promise(r=>setTimeout(r,Math.max(0,Math.min(4000,ticket.readyAt-Date.now()+100))));
    if(account.current!==entry.owner)throw Error('账号已切换');
    const result=await socialRequest<Partial<Ticket>&{wallet?:Wallet}>('/learning/complete','POST',{attemptId:ticket.attemptId,phase,wordIds});
    if(result.wallet)entry.submissions.clear();ticket={...ticket,...result,nextPhase:result.nextPhase??phase+1};entry.ticket=Promise.resolve(ticket);
    if(account.current===entry.owner){if(result.wallet)setWallet(result.wallet);setLearningError('');retry.current=null;window.dispatchEvent(new Event('englishblocks-social-refresh'));}
   }
  }catch(error){if(error instanceof Error&&error.message.includes('过期'))entry.ticket=null;if(account.current===entry.owner){setLearningError('本题本机成绩已保留；有效学习记录暂未确认。');retry.current=async()=>{await drain(entry);};}}
  finally{entry.running=false;}
 };
 const record=(phase:number,words:(WordBlock|null)[])=>{
  if(!userId)return;const entry=start(levelId);entry.submissions.set(phase,words.map(w=>w?.id||''));void drain(entry);
 };
 const retryRecord=()=>{void retry.current?.();};
 return {inbox,pending,wallet,refresh,record,learningError,retryRecord};
}
