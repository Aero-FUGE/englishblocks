import { CloudApiError as CloudError, readCloudResponse } from '../../shared/cloud-response.mjs';
import { validSnapshot } from '../../shared/snapshot.mjs';
import type { UserProfile } from '../types/game';
import type { CatCollection } from '../components/CatWardrobeModal';
import { sound } from './sound';

export type CloudSnapshot = {profile:UserProfile;collection:CatCollection;preferences?:Preferences};
type Preferences = {sound:boolean;speech:boolean;sfx:number;cat:number;bgm:number;mode:'single'|'list';track:string;rate:number;gender:'female'|'male';speechVolume:number;autoRead:boolean;muted:Record<string,boolean>};
export type RemoteSave = {revision:number;snapshot:CloudSnapshot|null;updatedAt?:string};
type Session = {token:string;expiresAt:number;user:{id:string;username:string}};
type Binding = {endpoint:string;userId:string;revision:number;base:string};
type Backup = {at:string;snapshot:CloudSnapshot;account:string};
type Conflict = {reason:'initial'|'conflict'|'restore';remote:RemoteSave};
export type CloudState = {user:Session['user']|null;status:string;error:string;busy:boolean;conflict:Conflict|null;updatedAt?:string;backups:Backup[];needsReload?:boolean};
const PROFILE='word_candy_single_profile_v3', COLLECTION='english_blocks_cat_collection_v1';
const BINDING='englishblocks_cloud_binding_v1', BACKUPS='englishblocks_cloud_backups_v1';
export const CLOUD_ENDPOINT = (import.meta.env.VITE_CLOUD_URL || (/^https?:$/.test(location.protocol)?location.origin:'')).replace(/\/$/,'');
const SESSION='englishblocks_cloud_session_v1:'+CLOUD_ENDPOINT;
function read<T>(key:string,fallback:T):T {try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}}
function stable(value:unknown):string {
  return JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
}
export function getPreferences():Preferences {
  return {sound:sound.enabled,speech:sound.speechEnabled,sfx:sound.sfxVolume,cat:sound.catVolume,bgm:sound.bgmVolume,mode:sound.bgmMode,track:sound.currentTrack?.isBuiltIn?sound.currentTrackId:'builtin_music_box',rate:sound.speechRate,gender:sound.speechGender,speechVolume:sound.speechVolume,autoRead:sound.autoReadOnSuccess,muted:read('english_blocks_muted_slots_v1',{})};
}
function applyPreferences(p:Preferences|undefined) {
  if(!p)return;
  if(typeof p.sound==='boolean')sound.setMasterEnabled(p.sound);
  if(typeof p.speech==='boolean')sound.setSpeechEnabled(p.speech);
  if(Number.isFinite(p.sfx))sound.setEffectsVolume('sfx',p.sfx);
  if(Number.isFinite(p.cat))sound.setEffectsVolume('cat',p.cat);
  if(Number.isFinite(p.bgm))sound.setVolume(p.bgm);
  if(p.mode==='single'||p.mode==='list')sound.setBgmMode(p.mode);
  if(Number.isFinite(p.rate))sound.setSpeechRate(p.rate);
  if(p.gender==='female'||p.gender==='male')sound.setSpeechGender(p.gender);
  if(Number.isFinite(p.speechVolume))sound.setSpeechVolume(p.speechVolume);
  if(typeof p.autoRead==='boolean')sound.setAutoReadOnSuccess(p.autoRead);
  if(p.muted && typeof p.muted==='object')for(const id of new Set([...Object.keys(read<Record<string,boolean>>('english_blocks_muted_slots_v1',{})),...Object.keys(p.muted)]))sound.setSlotMuted(id,p.muted[id]===true);
  if(sound.tracks.some(t=>t.isBuiltIn&&t.id===p.track)&&sound.currentTrackId!==p.track)sound.selectTrack(p.track);
}
class CloudSync {
  private session:Session|null=read(SESSION,null);
  private listeners=new Set<()=>void>();
  private epoch=0;
  private active=false;
  private getLocal:(()=>CloudSnapshot)|null=null;
  private applyLocal:((s:CloudSnapshot)=>void)|null=null;
  private learning:()=>boolean=()=>false;
  private state:CloudState={user:this.session?.user||null,status:this.session?'等待同步':'仅保存在本机',error:'',busy:false,conflict:null,backups:read(BACKUPS,[])};
  subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
  getState=()=>this.state;
  private update(patch:Partial<CloudState>){this.state={...this.state,...patch};this.listeners.forEach(fn=>fn());}
  request<T>(path:string,method='GET',body?:unknown){return this.api<T>(path,method,body);}
  askMimi(body:unknown){return this.api<{reply:string}>('/mimi','POST',body);}
  configure(get:()=>CloudSnapshot,apply:(s:CloudSnapshot)=>void,learning:()=>boolean){this.getLocal=get;this.applyLocal=apply;this.learning=learning;}
  private async api<T>(path:string,method='GET',body?:unknown,token=this.session?.token):Promise<T>{
    if(!CLOUD_ENDPOINT)throw Error('此 Windows 版本尚未配置云服务地址，请安装配置云服务后的版本');
    const url=new URL(CLOUD_ENDPOINT);
    if(url.protocol!=='https:' && !(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw Error('云服务地址必须使用 HTTPS');
    let response:Response;
    try {
      response=await fetch(CLOUD_ENDPOINT+'/api/cloud'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(path==='/mimi'?35000:12000),cache:'no-store'});
    } catch(error) {
      const timeout=error instanceof DOMException && ['TimeoutError','AbortError'].includes(error.name);
      throw Error(timeout?'云服务响应超时，请稍后重试。本机记录已保留。':'暂时无法连接云服务，请确认预览服务已启动、网络正常后重试。本机记录已保留。');
    }
    return await readCloudResponse(response,path) as T;
  }
  async authenticate(username:string,password:string,register:boolean){
    if(this.state.busy)return;
    const epoch=++this.epoch;this.update({busy:true,error:'',conflict:null,status:'正在登录'});
    try {
      const session=await this.api<Session>(register?'/register':'/login','POST',{username,password},undefined);
      if(epoch!==this.epoch)return;
      localStorage.setItem(SESSION,JSON.stringify(session));this.session=session;
      this.update({user:session.user,busy:false,status:'正在读取云端记录'});await this.sync();
    }catch(error){if(epoch===this.epoch)this.update({busy:false,error:error instanceof Error?error.message:'连接失败',status:'登录未完成'});}
  }
  async logout(){
    const token=this.session?.token;++this.epoch;this.session=null;localStorage.removeItem(SESSION);
    this.update({user:null,conflict:null,error:'',busy:false,status:'已退出，记录保留在本机',updatedAt:undefined});
    if(token)try{await this.api('/logout','POST',{},token);}catch{/* Local sign-out works offline; the server session also expires. */}
  }
  private binding(){return read<Binding|null>(BINDING,null);}
  private bind(remote:RemoteSave,base:CloudSnapshot){
    localStorage.setItem(BINDING,JSON.stringify({endpoint:CLOUD_ENDPOINT,userId:this.session!.user.id,revision:remote.revision,base:stable(base)}));
    this.update({status:'已同步',error:'',conflict:null,updatedAt:remote.updatedAt});
  }
  private backup(snapshot:CloudSnapshot){
    const item={at:new Date().toISOString(),snapshot,account:this.binding()?.userId||'local'};
    const previous=read<Backup[]>(BACKUPS,[]);
    // Save before replacing anything. If browser storage is full, abort the replacement.
    const backups=[item,...previous].slice(0,3);
    localStorage.setItem(BACKUPS,JSON.stringify(backups));this.update({backups});
  }
  private apply(snapshot:CloudSnapshot){
    if(!this.getLocal||!this.applyLocal)throw Error('游戏尚未准备好');
    if(!validSnapshot(snapshot))throw Error('云端或备份中的存档格式不正确，本机记录未替换');
    this.backup(this.getLocal());
    localStorage.setItem(PROFILE,JSON.stringify(snapshot.profile));localStorage.setItem(COLLECTION,JSON.stringify(snapshot.collection));
    applyPreferences(snapshot.preferences);this.applyLocal(snapshot);
  }
  private fail(error:unknown){
    if(error instanceof CloudError&&error.status===401){this.session=null;localStorage.removeItem(SESSION);this.update({user:null,status:'登录已失效，请重新登录',busy:false,error:'本机未同步记录仍然保留'});return;}
    this.update({status:'等待重连，本机记录已保留',error:error instanceof Error?error.message:'网络不可用',busy:false});
  }
  async sync(){
    if(!this.session||!this.getLocal||this.active||this.state.busy||this.state.conflict)return;
    this.active=true;const epoch=this.epoch;
    try {
      const remote=await this.api<RemoteSave>('/save');if(epoch!==this.epoch)return;
      const local=this.getLocal(),binding=this.binding(),localText=stable(local);
      if(!binding||binding.endpoint!==CLOUD_ENDPOINT||binding.userId!==this.session.user.id||!remote.snapshot){
        this.update({conflict:{reason:'initial',remote},status:'请选择首次同步方式',error:''});return;
      }
      if(localText===stable(remote.snapshot)){this.bind(remote,local);return;}
      if(remote.revision!==binding.revision){
        if(localText===binding.base&&!this.learning()){this.apply(remote.snapshot);this.bind(remote,remote.snapshot);}
        else this.update({conflict:{reason:'conflict',remote},status:'两端记录不同，等待选择',error:''});
        return;
      }
      if(localText!==binding.base){
        this.update({status:'正在上传'});
        const saved=await this.api<RemoteSave>('/save','PUT',{snapshot:local,expectedRevision:remote.revision});
        if(epoch===this.epoch)this.bind(saved,local);
      } else this.update({status:'已同步',error:'',updatedAt:remote.updatedAt});
    }catch(error){if(epoch!==this.epoch)return;if(error instanceof CloudError&&error.status===409)this.update({conflict:{reason:'conflict',remote:error.data as RemoteSave},status:'云端有新记录，等待选择',error:''});else this.fail(error);}
    finally{this.active=false;}
  }
  async resolve(source:'local'|'cloud'){
    if(!this.session||!this.getLocal||this.active||this.state.busy)return;
    this.active=true;const epoch=this.epoch;this.update({busy:true,error:''});
    try{
      const remote=await this.api<RemoteSave>('/save');if(epoch!==this.epoch)return;
      if(this.state.conflict && remote.revision!==this.state.conflict.remote.revision){
        this.update({conflict:{reason:this.state.conflict.reason,remote},status:'云端记录已更新，已刷新对比，请重新选择'});return;
      }
      if(source==='cloud'){
        if(!remote.snapshot)throw Error('云端还没有存档，请先上传本机记录');
        this.apply(remote.snapshot);this.bind(remote,remote.snapshot);
      }else{
        const local=this.getLocal();this.backup(local);
        const saved=await this.api<RemoteSave>('/save','PUT',{snapshot:local,expectedRevision:remote.revision});
        if(epoch===this.epoch)this.bind(saved,local);
      }
    }catch(error){if(epoch!==this.epoch)return;if(error instanceof CloudError&&error.status===409)this.update({conflict:{reason:'conflict',remote:error.data as RemoteSave},status:'另一设备刚刚更新，请重新选择',error:''});else this.fail(error);}
    finally{this.active=false;if(epoch===this.epoch)this.update({busy:false});}
  }
  restore(index:number){
    const saved=this.state.backups[index];if(!saved||!this.getLocal||this.active||this.state.busy)return;
    this.apply(saved.snapshot);localStorage.removeItem(BINDING);
    // Pause uploads until a deliberate choice; the cloud remains untouched.
    this.update({conflict:this.session?{reason:'restore',remote:this.state.conflict?.remote||{revision:0,snapshot:null}}:null,status:'本机备份已恢复，云端未改动'});
  }
  downloadLocal(){
    if(!this.getLocal)return;const blob=new Blob([JSON.stringify({format:'englishblocks-cloud-local',version:1,createdAt:new Date().toISOString(),snapshot:this.getLocal()},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='英语拼块-本机同步备份.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  importLocal(snapshot:CloudSnapshot){
    if(!validSnapshot(snapshot))throw Error('备份中的学习记录格式不正确');
    if(this.active||this.state.busy)throw Error('正在同步，请稍后导入');
    this.apply(snapshot);localStorage.removeItem(BINDING);this.update({conflict:this.session?{reason:'restore',remote:{revision:0,snapshot:null}}:null,status:'备份已恢复到本机，云端未改动'});}
  onOtherTab=()=>{
    const changed=read<Session|null>(SESSION,null);
    ++this.epoch;
    this.session=changed;
    this.getLocal=null;
    this.update({user:changed?.user||null,conflict:null,status:'其他标签页更新了账号或记录，请刷新后继续同步',error:'本标签页已暂停同步，避免旧记录覆盖新记录',busy:false,needsReload:true});
  };

}
export const cloudSync=new CloudSync();
