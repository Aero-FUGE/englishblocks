import React,{useEffect,useRef} from 'react';
import {X} from 'lucide-react';
import {ModalOverlay} from './ModalOverlay';
export function WardrobeLockedDialog({onClose}:{onClose:()=>void}){
 const panel=useRef<HTMLElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;panel.current?.querySelector<HTMLButtonElement>('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();onClose();}if(e.key==='Tab'){const buttons=Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button')||[]),first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);previous?.focus();};},[onClose]);
 return <ModalOverlay className="eb-season-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={panel} className="eb-season-dialog eb-wardrobe-lock" role="dialog" aria-modal="true" aria-label="衣柜尚未解锁"><header><h2>🔒 小猫衣柜</h2><button type="button" aria-label="关闭衣柜提示" title="关闭" onClick={onClose}><X size={20}/></button></header><p>完成高中阶段，升入大学后，小猫的衣柜就会打开啦！</p><button type="button" className="eb-wardrobe-lock-dismiss" onClick={onClose}>知道啦，继续学习 ♡</button></section></ModalOverlay>;
}
