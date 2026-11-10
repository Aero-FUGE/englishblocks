import React,{useEffect,useRef,useState} from 'react';
import {EggAnimation,PrankItems} from './FriendsPage';
import {handlePrank,type PrankNotice,type Wallet} from '../utils/social';
export function PrankToast({inbox,wallet,open,onClose,onViewAll}:{inbox:PrankNotice[];wallet:Wallet|null;open:boolean;onClose:()=>void;onViewAll:()=>void}){
 const [teaser,setTeaser]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[animation,setAnimation]=useState(0);
 const shown=useRef(new Set<string>()),lock=useRef(false),active=inbox[0];
 useEffect(()=>{if(!active||shown.current.has(active.id))return;shown.current.add(active.id);setTeaser(true);const timer=setTimeout(()=>setTeaser(false),6000);return()=>clearTimeout(timer);},[active?.id]);
 async function act(id:string,action:'handle'|'counter'){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await handlePrank(id,action);setAnimation(v=>v+1);onClose();setTeaser(false);}catch(e){setError(e instanceof Error?e.message:'暂时没有处理成功，请重试');}finally{lock.current=false;setBusy(false);}}
 return <><EggAnimation trigger={animation}/>{active&&(open||teaser)&&<aside className="eb-prank-toast" aria-label="离线恶作剧通知"><div className="eb-mimi-header"><strong>🥚 小窝来信</strong><button aria-label="稍后处理恶作剧" onClick={()=>{setTeaser(false);onClose();void handlePrank(active.id,'seen').catch(()=>{});}}>×</button></div>{error&&<p role="alert">{error}</p>}{open?<PrankItems items={[active]} wallet={wallet} busy={busy} onAction={(id,action)=>void act(id,action)}/>:<p>{active.senderName}趁你不在，送来了一颗臭鸡蛋！</p>}<button onClick={()=>{setTeaser(false);onClose();onViewAll();}}>去好友小窝查看全部 →</button></aside>}</>;
}
