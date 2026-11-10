import React from 'react';
import type { UserProfile } from '../types/game';
import type { CatCollection } from '../components/CatWardrobeModal';
import {getLocal,isFresh,getRevision,setRevision,request,upload,writeLocal,type Snapshot} from './lanSync';

export function useLanSync(profile:UserProfile, collection:CatCollection,
  setProfile:React.Dispatch<React.SetStateAction<UserProfile>>,
  setCollection:React.Dispatch<React.SetStateAction<CatCollection>>,
  onRemote:(snapshot:Snapshot)=>void) {
  const latest=React.useRef<Snapshot>({profile,collection});
  latest.current={profile,collection};
  const loaded=React.useRef(false),busy=React.useRef(false),lastSent=React.useRef('');
  const onRemoteRef=React.useRef(onRemote);onRemoteRef.current=onRemote;
  const apply=(snapshot:Snapshot,revision:number)=>{
    busy.current=true;setRevision(revision);writeLocal(snapshot);lastSent.current=JSON.stringify(snapshot);
    setProfile(snapshot.profile);setCollection(snapshot.collection);onRemoteRef.current(snapshot);
    window.setTimeout(()=>{busy.current=false;},120);
  };
  React.useEffect(()=>{
    let alive=true;
    async function tick(){
      if(!alive||busy.current)return;
      busy.current=true;
      try{
        const remote=await request('GET');if(!alive||remote.status!==200||!remote.body)return;
        const {revision,snapshot}=remote.body;
        const local=latest.current;
        const localString=JSON.stringify(local);
        const known=getRevision();
        if(!loaded.current){
          loaded.current=true;
          if(snapshot && (isFresh(local)||known===revision)){
            if(JSON.stringify(snapshot)!==localString)apply(snapshot,revision);
            else {setRevision(revision);lastSent.current=localString;}
            return;
          }
          if(snapshot && known!==revision && !isFresh(local)){
            const useRemote=window.confirm('检测到电脑存档中心与当前设备的学习记录不同。\n\n确定：使用共享存档（本机记录保留在原设备备份中）\n取消：暂不覆盖，保持本机记录。');
            if(useRemote){apply(snapshot,revision);return;}
            // No automatic overwrite when a conflict is unresolved.
            loaded.current=false;return;
          }
          if(!snapshot){const put=await upload(local,0);if(put.status===200&&put.body){setRevision(put.body.revision);lastSent.current=localString;}return;}
        }
        if(revision!==known){
          if(lastSent.current===localString||isFresh(local))apply(snapshot!,revision);
          else {
            // Conflict: don't overwrite either side; ask explicitly.
            const takeRemote=window.confirm('其他设备更新了共享存档，本机也有未同步的改动。\n确定：采用共享存档\n取消：保留本机改动，暂不覆盖共享存档。');
            if(takeRemote)apply(snapshot!,revision);
            else {loaded.current=false;}
          }
          return;
        }
        if(localString!==lastSent.current){
          const put=await upload(local,revision);
          if(put.status===200&&put.body){setRevision(put.body.revision);lastSent.current=localString;}
          // If revision changed mid-request, next tick will resolve conflict.
        }
      }finally{busy.current=false;}
    }
    const start=window.setTimeout(tick,1100);
    const interval=window.setInterval(tick,2500);
    const visibility=()=>{if(!document.hidden)void tick();};
    document.addEventListener('visibilitychange',visibility);
    return()=>{alive=false;window.clearTimeout(start);window.clearInterval(interval);document.removeEventListener('visibilitychange',visibility);};
  },[]);
}
