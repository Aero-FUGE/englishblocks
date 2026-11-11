import {useEffect,useRef,useState} from 'react';
import type {PointerEvent} from 'react';
export const WORD_HOLD_MS=3000;
/** Native scrolling stays enabled; moving or scrolling cancels both hold and tap. */
export function useWordPress(onHold:()=>void){
 const [pressing,setPressing]=useState(false);
 const [held,setHeld]=useState(false);
 const rebound=useRef<ReturnType<typeof setTimeout>|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const start=useRef<{id:number;x:number;y:number}|null>(null);
 const suppress=useRef(false), callback=useRef(onHold);callback.current=onHold;
 const cancel=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;start.current=null;setPressing(false);};
 useEffect(()=>{const abort=()=>{if(start.current){suppress.current=true;cancel();}};window.addEventListener('scroll',abort,true);window.addEventListener('blur',abort);return()=>{if(timer.current)clearTimeout(timer.current);if(rebound.current)clearTimeout(rebound.current);window.removeEventListener('scroll',abort,true);window.removeEventListener('blur',abort);};},[]);
 return {pressing,held,consumeClick:()=>{const blocked=suppress.current;suppress.current=false;return blocked;},
  onPointerDown:(e:PointerEvent<HTMLElement>)=>{if(e.button!==0||e.pointerType==='mouse'||!e.isPrimary)return;if((e.target as HTMLElement).closest('button'))return;cancel();suppress.current=false;start.current={id:e.pointerId,x:e.clientX,y:e.clientY};setPressing(true);timer.current=setTimeout(()=>{suppress.current=true;cancel();setHeld(true);if(rebound.current)clearTimeout(rebound.current);rebound.current=setTimeout(()=>setHeld(false),220);callback.current();},WORD_HOLD_MS);},
  onPointerMove:(e:PointerEvent<HTMLElement>)=>{const s=start.current;if(s&&s.id===e.pointerId&&Math.hypot(e.clientX-s.x,e.clientY-s.y)>10){suppress.current=true;cancel();}},
  onPointerUp:()=>cancel(),onPointerCancel:()=>{suppress.current=true;cancel();},onPointerLeave:()=>{if(start.current){suppress.current=true;cancel();}}
 };
}
