import React,{useEffect,useRef} from 'react';
import confetti from 'canvas-confetti';
import {ModalOverlay} from './ModalOverlay';
export function MusicCelebration({title,mode,onClose}:{title:string;mode:'organize'|'retrieve';onClose:()=>void}){
 const close=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;close.current?.focus();try{confetti({particleCount:80,spread:70,origin:{y:.6},zIndex:220,disableForReducedMotion:true,colors:['--theme-primary','--theme-accent','--theme-decoration'].map(t=>getComputedStyle(document.documentElement).getPropertyValue(t).trim())});}catch{}const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();onClose();}if(e.key==='Tab'){e.preventDefault();close.current?.focus();}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);previous?.focus();};},[onClose]);
 return <ModalOverlay className="eb-season-overlay"><section role="dialog" aria-modal="true" aria-label="音乐史通关庆祝" className="eb-music-celebration animate-scale-up"><span className="eb-music-celebration-stars" aria-hidden="true">✦ ♫ ✦</span><p>拼对啦！</p><h2>{title} · 闯关成功</h2><p>{mode==='organize'?'一刷完成，新的知识星星亮起来啦！':'二刷完成，知识已经稳稳记在心里啦！'}</p><button type="button" ref={close} className="eb-music-primary" onClick={onClose}>太棒啦，继续 ♡</button></section></ModalOverlay>;
}
