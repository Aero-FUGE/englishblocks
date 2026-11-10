/** Persist user-imported audio bytes (blob: URLs do not survive reloads). */
const DB = 'english_blocks_audio_v1';
const STORE = 'bgm';
function database(): Promise<IDBDatabase> {
  return new Promise((resolve,reject) => {
    const req = indexedDB.open(DB,1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function saveAudio(id:string,file:Blob):Promise<void> {
  const db=await database();
  try { await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(file,id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);}); }
  finally {db.close();}
}
export async function loadAudio(id:string):Promise<Blob|undefined> {
  const db=await database();
  try {return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  finally {db.close();}
}
export async function removeAudio(id:string):Promise<void> {
  const db=await database();
  try {await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
  finally {db.close();}
}

function blobToBase64(blob:Blob):Promise<string> {
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
}
export async function exportAudioBackup():Promise<{id:string,type:string,data:string}[]> {
  const db=await database();
  try {
    const entries=await new Promise<{id:string,blob:Blob}[]>((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly');const store=tx.objectStore(STORE);const result:{id:string,blob:Blob}[]=[];
      const req=store.openCursor();req.onsuccess=()=>{const cursor=req.result;if(cursor){if(cursor.value instanceof Blob)result.push({id:String(cursor.key),blob:cursor.value});cursor.continue();}else resolve(result);};req.onerror=()=>reject(req.error);
    });
    return Promise.all(entries.map(async e=>({id:e.id,type:e.blob.type,data:await blobToBase64(e.blob)})));
  } finally {db.close();}
}
export async function importAudioBackup(entries:{id:string,type:string,data:string}[]):Promise<void> {
  const db=await database();
  try {
    for(const e of entries){
      if(typeof e.id!=='string'||typeof e.data!=='string'||!(/^[A-Za-z0-9+/]*={0,2}$/).test(e.data))throw Error('音频备份格式不正确');
      const binary=atob(e.data);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(new Blob([bytes],{type:e.type||'audio/mpeg'}),e.id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});
    }
  }finally{db.close();}
}
