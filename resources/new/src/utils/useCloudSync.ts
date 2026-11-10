import { useEffect, useRef, useSyncExternalStore } from 'react';
import { cloudSync, getPreferences, type CloudSnapshot } from './cloudSync';
import type { UserProfile } from '../types/game';
import type { CatCollection } from '../components/CatWardrobeModal';
export function useCloudSync(profile:UserProfile,collection:CatCollection,apply:(s:CloudSnapshot)=>void,learning:()=>boolean){
  const latest=useRef({profile,collection,apply,learning});latest.current={profile,collection,apply,learning};
  useEffect(()=>{
    cloudSync.configure(()=>({profile:latest.current.profile,collection:latest.current.collection,preferences:getPreferences()}),s=>latest.current.apply(s),()=>latest.current.learning());
    void cloudSync.sync();
    const timer=setInterval(()=>{if(!document.hidden)void cloudSync.sync();},5000);
    const wake=()=>{if(!document.hidden)void cloudSync.sync();};
    const storage=(event:StorageEvent)=>{if(event.key===null||event.key.startsWith('englishblocks_cloud_session_v1:')||['word_candy_single_profile_v3','english_blocks_cat_collection_v1','englishblocks_cloud_binding_v1','english_blocks_audio_levels_v1','english_blocks_bgm_settings_v1','english_blocks_muted_slots_v1','english_blocks_sound_enabled_v1','english_blocks_speech_settings_v2'].includes(event.key))cloudSync.onOtherTab();};
    window.addEventListener('online',wake);document.addEventListener('visibilitychange',wake);window.addEventListener('storage',storage);
    return()=>{clearInterval(timer);window.removeEventListener('online',wake);document.removeEventListener('visibilitychange',wake);window.removeEventListener('storage',storage);};
  },[]);
  return useSyncExternalStore(cloudSync.subscribe,cloudSync.getState);
}
