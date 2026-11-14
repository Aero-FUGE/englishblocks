import React,{useEffect,useRef,useState} from 'react';
import {Check,X,Flower2,Sun,Leaf,Snowflake} from 'lucide-react';
import {ModalOverlay} from './ModalOverlay';
import {SEASONS,SEASON_LABELS,useSeasonTheme,previewSeason,setSeason,type Season} from '../utils/seasonTheme';
import {useCosmetics} from './CosmeticsContext';
import {ownsCosmetic,unlockCosmetic,THEME_PRICE} from '../utils/cosmetics';
const seasonIcons={spring:Flower2,summer:Sun,autumn:Leaf,winter:Snowflake};
export function SeasonPicker({onSelect}:{onSelect?:()=>void}){
 const[season]=useSeasonTheme();const{collection,setCollection}=useCosmetics();
 const[preview,setPreview]=useState<Season|null>(null),[notice,setNotice]=useState('');const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const restore=useRef<Season>('summer');
 const cancel=()=>{if(timer.current){clearTimeout(timer.current);timer.current=null;setSeason(restore.current);}setPreview(null);};
 useEffect(()=>{restore.current=collection.selectedSeason&&ownsCosmetic(collection,'theme',collection.selectedSeason)?collection.selectedSeason:'summer';if(timer.current){clearTimeout(timer.current);timer.current=null;setPreview(null);setSeason(restore.current);}},[collection.selectedSeason,collection.unlockedThemes]);
 useEffect(()=>()=>{if(timer.current){clearTimeout(timer.current);setSeason(restore.current);}},[]);
 const showPreview=(value:Season)=>{cancel();restore.current=collection.selectedSeason&&ownsCosmetic(collection,'theme',collection.selectedSeason)?collection.selectedSeason:'summer';setPreview(value);previewSeason(value);timer.current=setTimeout(()=>{timer.current=null;setSeason(restore.current);setPreview(null);},3000);};
 return <section className="eb-season-picker" aria-label="四季主题"><p>🐟 {collection.fish} · 夏日免费，其他季节各 {THEME_PRICE} 小鱼干</p><div className="eb-season-choices">{SEASONS.map(value=>{const Icon=seasonIcons[value],owned=ownsCosmetic(collection,'theme',value);return <div key={value} className={`eb-season-choice eb-choice-${value}`} data-active={!preview&&season===value}><button type="button" aria-label={SEASON_LABELS[value]} aria-pressed={!preview&&season===value} onClick={()=>{cancel();if(!owned){if(collection.fish<THEME_PRICE){setNotice('小鱼干还不够，再完成一些学习挑战吧！');return;}setCollection(c=>unlockCosmetic(c,'theme',value));setNotice('主题已解锁！点击「使用主题」即可换装。');return;}setCollection(c=>({...c,selectedSeason:value}));setSeason(value);onSelect?.();}}><span className="eb-season-swatch"><Icon size={25} strokeWidth={1.6}/>{!preview&&season===value&&<Check className="eb-season-check" size={12}/>}</span><strong>{SEASON_LABELS[value].split(' ')[1]}</strong><small>{owned?'使用主题':`🔒 ${THEME_PRICE} 小鱼干解锁`}</small></button><button type="button" className="eb-cosmetic-preview" onClick={()=>showPreview(value)}>{preview===value?'预览中 · 3 秒':'预览 3 秒'}</button></div>;})}</div><p role="status">{notice}</p></section>;
}
export function SeasonDialog({onClose}:{onClose:()=>void}){
 const panel=useRef<HTMLDivElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;panel.current?.querySelector<HTMLButtonElement>('[aria-pressed=true]')?.focus();const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();onClose();}if(event.key==='Tab'){const buttons=Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button')||[]);const first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);previous?.focus();};},[onClose]);
 return <ModalOverlay className="eb-season-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div ref={panel} role="dialog" aria-modal="true" aria-labelledby="eb-season-title" className="eb-season-dialog"><header><div><h2 id="eb-season-title">换一个季节，换一份心情</h2><p>选择你喜欢的花园风景</p></div><button type="button" aria-label="关闭四季主题" onClick={onClose}><X size={18}/></button></header><SeasonPicker onSelect={onClose}/><p className="eb-season-note">解锁只需购买一次；预览不扣小鱼干，3 秒后自动恢复。</p></div></ModalOverlay>;
}
