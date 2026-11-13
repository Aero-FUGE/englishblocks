import React,{useEffect,useRef} from 'react';
import confetti from 'canvas-confetti';
import {Sparkles,ArrowRight} from 'lucide-react';
import {ModalOverlay} from './ModalOverlay';
import {taskTitle} from '../utils/studyTasks';
import {sound} from '../utils/sound';
export function TaskCelebrationModal({fish,awards,onContinue}:{fish:number;awards:string[];onContinue:()=>void}){
 const button=useRef<HTMLButtonElement>(null),celebrated=useRef(false);
 useEffect(()=>{button.current?.focus();if(celebrated.current)return;celebrated.current=true;sound.playSlot('reward');const style=getComputedStyle(document.documentElement);try{confetti({particleCount:85,spread:85,origin:{y:.48},zIndex:1300,colors:['--theme-primary','--theme-accent','--theme-decoration'].map(p=>style.getPropertyValue(p).trim()),disableForReducedMotion:true});}catch{}},[]);
 return <ModalOverlay className="eb-tasks-overlay eb-task-award-overlay"><section role="dialog" aria-modal="true" aria-label="挑战达成庆祝" className="eb-task-award-panel" onKeyDown={e=>{if(e.key==='Tab'){e.preventDefault();button.current?.focus();}if(e.key==='Escape'){e.preventDefault();onContinue();}}}>
 <div className="eb-award-rays" aria-hidden="true"/><span className="eb-award-ribbon"><Sparkles size={16}/>挑战大成功！<Sparkles size={16}/></span>
 <div className="eb-award-mascot"><span aria-hidden="true">✦</span><img src="./assets/mimi-translator/half.png" alt="咪咪为你庆祝"/><span aria-hidden="true">✧</span></div>
 <h2>努力的小猫，宝藏是你的！</h2><p>这份奖励，专属于刚刚坚持的你 ♡</p>
 <div className="eb-award-fish">🐟 <strong>+{fish}</strong><span>额外小鱼干已到账</span></div>
 <ul>{awards.map(id=><li key={id}>🏅 {taskTitle(id)}</li>)}</ul>
 <button ref={button} onClick={onContinue}>收好奖励，继续冒险 <ArrowRight size={17}/></button>
 </section></ModalOverlay>;
}
