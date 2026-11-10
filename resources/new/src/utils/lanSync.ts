import type { UserProfile } from '../types/game';
import type { CatCollection } from '../components/CatWardrobeModal';

const KEY='english_blocks_lan_sync_v27';
const PROFILE='word_candy_single_profile_v3';
const COLLECTION='english_blocks_cat_collection_v1';
export type Snapshot={profile:UserProfile;collection:CatCollection};
type Remote={revision:number;snapshot:Snapshot|null;updatedAt?:string};
const bridge=(window as unknown as {englishBlocksDiskSave?:{lanRequest?:(method:string,payload?:unknown)=>Promise<{status:number;body:Remote|null}>}}).englishBlocksDiskSave;
const deviceId=(()=>{const key='english_blocks_lan_device_id';let id=localStorage.getItem(key);if(!id){id=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem(key,id);}return id;})();
export function getLocal():Snapshot|null{try{const p=localStorage.getItem(PROFILE),c=localStorage.getItem(COLLECTION);return p&&c?{profile:JSON.parse(p),collection:JSON.parse(c)}:null;}catch{return null;}}
export function isFresh(snapshot:Snapshot){return !(snapshot.profile.completedLevelIds?.length||snapshot.profile.totalAttempts||snapshot.collection.fish||snapshot.collection.owned?.length);}
export function getRevision(){return Number(localStorage.getItem(KEY)||'0')||0;}
export function setRevision(revision:number){localStorage.setItem(KEY,String(revision));}
export async function request(method:'GET'|'PUT',payload?:unknown):Promise<{status:number;body:Remote|null}>{
  try {
    if(bridge?.lanRequest)return await bridge.lanRequest(method,payload);
    const response=await fetch('/api/lan-save',{method,cache:'no-store',headers:{'Content-Type':'application/json'},body:method==='PUT'?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(3500)});
    return {status:response.status,body:await response.json()};
  }catch{return {status:503,body:null};}
}
export async function upload(snapshot:Snapshot,revision:number){return request('PUT',{snapshot,expectedRevision:revision,deviceId});}
export function writeLocal(snapshot:Snapshot){localStorage.setItem(PROFILE,JSON.stringify(snapshot.profile));localStorage.setItem(COLLECTION,JSON.stringify(snapshot.collection));}
