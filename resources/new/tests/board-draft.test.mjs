import assert from 'node:assert/strict';
import {restoreBoard,persistBoard} from '../src/utils/boardDraft.ts';
import {newRail,putFirstAvailable,takeBack} from '../src/utils/railState.ts';
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const words=Array.from({length:8},(_,i)=>({id:'w'+i,text:'word'+i}));
let board=newRail(words,w=>w.slice());
for(let i=0;i<100;i++){
 board=putFirstAvailable(board,'w'+(i%8));persistBoard('a',1,0,board);
 assert.deepEqual(restoreBoard('a',1,0,words),board);
 board=takeBack(board,0);persistBoard('a',1,0,board);
 assert.deepEqual(restoreBoard('a',1,0,words),board);
}
assert.equal(restoreBoard('b',1,0,words),null);
assert.equal(restoreBoard('a',2,0,words),null);
assert.equal(restoreBoard('a',1,1,words),null);
const key='englishblocks_board_drafts_v1';
store.set(key,JSON.stringify({'["a",1,0]':{slots:Array(8).fill('w0'),pool:[]}}));assert.equal(restoreBoard('a',1,0,words),null);
store.set(key,'broken JSON');assert.equal(restoreBoard('a',1,0,words),null);
localStorage.setItem=()=>{throw Error('quota exceeded');};persistBoard('a',1,0,board);
console.log('PASS: partial-board round trips, repeated moves, account/lesson/phase isolation, corrupted/duplicate save rejection and storage failure');
