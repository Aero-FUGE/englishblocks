import type {RailState} from './railState';
import type {WordBlock} from '../types/game';
const KEY='englishblocks_board_drafts_v1';
type Draft={slots:(string|null)[];pool:string[];phase:number;at:number};
function read():Record<string,Draft>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{return {};}}
const key=(owner:string,level:number,phase:number)=>JSON.stringify([owner,level,phase]);
/** Only IDs are stored; every restored word comes from the current lesson catalog. */
export function restoreBoard(owner:string,level:number,phase:number,words:WordBlock[]):RailState|null{
 const draft=read()[key(owner,level,phase)];
 if(!draft||!Array.isArray(draft.slots)||!Array.isArray(draft.pool)||draft.slots.length!==words.length)return null;
 const ids=[...draft.slots.filter(x=>x!==null),...draft.pool];
 const catalog=new Map(words.map(w=>[w.id,w]));
 if(ids.length!==words.length||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!catalog.has(id)))return null;
 return {slots:draft.slots.map(id=>id===null?null:catalog.get(id)!),pool:draft.pool.map(id=>catalog.get(id)!)};
}
export function persistBoard(owner:string,level:number,phase:number,board:RailState){
 if(!board.slots.length)return;
 try{const drafts=read();drafts[key(owner,level,phase)]={slots:board.slots.map(w=>w?.id??null),pool:board.pool.map(w=>w.id),phase,at:Date.now()};
 // Bound local storage without ever modifying learning completion records.
 const sorted=Object.entries(drafts).sort((a,b)=>b[1].at-a[1].at).slice(0,120);
 localStorage.setItem(KEY,JSON.stringify(Object.fromEntries(sorted)));}catch{/* Storage unavailable: the current board remains usable. */}
}
