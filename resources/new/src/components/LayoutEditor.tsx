import React, { useState, useEffect, useRef } from 'react';
import creatorDesktopLayout from '../data/creatorDesktopLayout.json';

export type Region = { x: number; y: number; scale: number };
export type ElementLayout = { x:number; y:number; width:number|null; height:number|null };
export type LayoutConfig = { pageWidth: number; sidebarWidth: number; gap: number; sidebar: Region; progress: Region; board: Region; elements?: Record<string,ElementLayout> };
export const DEFAULT_LAYOUT: LayoutConfig = {
  pageWidth: 1280, sidebarWidth: 285, gap: 20,
  sidebar: {x:0,y:0,scale:100}, progress:{x:0,y:0,scale:100}, board:{x:0,y:0,scale:100}
};
const KEY='englishblocks_layout_dev_v34';
const MOBILE_KEY='englishblocks_mobile_layout_v34';
export const isMobilePreview=()=>new URLSearchParams(window.location.search).has('mobilePreview');
const selectedKey=()=>isMobilePreview()?MOBILE_KEY:KEY;
export const EDITABLE_AREAS = [
  ['sidebar','左侧导航'],['progress','顶部进度'],['status','奖励信息'],['board','学习主卡片'],
  ['target','中文题目'],['rail','句子组装轨道'],['bank','待选词块库'],['actions','底部操作按钮'],['mobileNav','手机导航']
] as const;
const starter = ():LayoutConfig => isMobilePreview()?DEFAULT_LAYOUT:{...DEFAULT_LAYOUT,...creatorDesktopLayout};
export const readLayout=()=>safeRead();
const developerMode = () => new URLSearchParams(window.location.search).get('layoutDev') === '1';
const safeRead = (): LayoutConfig => {
  try {
    const raw=localStorage.getItem(selectedKey());
    if (raw) {
      const v=JSON.parse(raw);
      return {...starter(),...v, sidebar:{...DEFAULT_LAYOUT.sidebar,...v.sidebar},progress:{...DEFAULT_LAYOUT.progress,...v.progress},board:{...DEFAULT_LAYOUT.board,...v.board},elements:v.elements||{}};
    }
  } catch {}
  return starter();
};
export function usePublishedLayout() {
  return {developerMode:developerMode(),initial:safeRead()};
}
const download = (config: LayoutConfig) => {
  const blob=new Blob([JSON.stringify(config,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url;a.download=isMobilePreview()?'englishblocks-mobile-layout.json':'englishblocks-desktop-layout.json';a.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),500);
};
export function applyElementLayouts(config:LayoutConfig) {
  for (const [id] of EDITABLE_AREAS) {
    const el=document.querySelector<HTMLElement>(`[data-eb-edit="${id}"]`);
    if (!el) continue;
    const d=config.elements?.[id];
    el.style.translate=d ? `${d.x}px ${d.y}px` : '';
    el.style.width=d?.width!=null ? `${d.width}px` : '';
    el.style.height=d?.height!=null ? `${d.height}px` : '';
    el.style.maxWidth=d?.width!=null ? 'none' : '';
    if (d?.height!=null) el.style.overflow='auto'; else el.style.overflow='';
  }
}
export function LayoutEditor({value,onChange,onClose}:{value:LayoutConfig;onChange:(v:LayoutConfig)=>void;onClose:()=>void}) {
  const [locked,setLocked]=useState(false);
  const [selected,setSelected]=useState<string>(isMobilePreview()?'target':'board');
  const [expanded,setExpanded]=useState(false);
  const [rect,setRect]=useState<DOMRect|null>(null);
  const valueRef=useRef(value); valueRef.current=value;
  const update=(patch:Partial<LayoutConfig>)=>onChange({...valueRef.current,...patch});
  const element=(id:string,patch:Partial<ElementLayout>)=>{
    const existing=valueRef.current.elements?.[id]||{x:0,y:0,width:null,height:null};
    update({elements:{...valueRef.current.elements,[id]:{...existing,...patch}}});
  };
  useEffect(()=>{
    const refresh=()=>setRect(document.querySelector<HTMLElement>(`[data-eb-edit="${selected}"]`)?.getBoundingClientRect()||null);
    refresh();window.addEventListener('resize',refresh);window.addEventListener('scroll',refresh,true);
    const t=window.setInterval(refresh,180);
    return ()=>{window.clearInterval(t);window.removeEventListener('resize',refresh);window.removeEventListener('scroll',refresh,true)};
  },[selected]);
  const startPointer=(e:React.PointerEvent,mode:'move'|'resize')=>{
    if(locked)return;
    const el=document.querySelector<HTMLElement>(`[data-eb-edit="${selected}"]`);if(!el)return;
    e.preventDefault();e.stopPropagation();
    const old=valueRef.current.elements?.[selected]||{x:0,y:0,width:null,height:null};
    const bounds=el.getBoundingClientRect();const sx=e.clientX,sy=e.clientY;
    const startW=old.width??Math.round(el.offsetWidth),startH=old.height??Math.round(el.offsetHeight);
    const move=(ev:PointerEvent)=>{
      const dx=ev.clientX-sx,dy=ev.clientY-sy;
      if(mode==='move')element(selected,{x:Math.round(old.x+dx),y:Math.round(old.y+dy)});
      else element(selected,{width:Math.max(80,Math.round(startW+dx)),height:Math.max(44,Math.round(startH+dy))});
    };
    const end=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end)};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',end,{once:true});
  };
  const save=()=>{localStorage.setItem(selectedKey(),JSON.stringify(value));window.dispatchEvent(new Event('englishblocks-layout-updated'));setLocked(true)};
  const selectedName=EDITABLE_AREAS.find(([id])=>id===selected)?.[1]||selected;
  const current=value.elements?.[selected]||{x:0,y:0,width:null,height:null};
  return <>
    {!locked && rect && <div className="fixed z-[92] pointer-events-none border-2 border-dashed border-[var(--theme-border-strong)] rounded-lg" style={{left:rect.left,top:rect.top,width:rect.width,height:rect.height}}>
      <div className="absolute -top-8 left-0 bg-[var(--theme-text)] text-white rounded-t-lg px-2 py-1 text-xs whitespace-nowrap pointer-events-auto cursor-move select-none touch-none" onPointerDown={e=>startPointer(e,'move')}>⠿ 拖动 {selectedName}</div>
      <div className="absolute -right-2 -bottom-2 w-6 h-6 rounded-md bg-[var(--theme-text)] border-2 border-white shadow-lg cursor-nwse-resize pointer-events-auto touch-none" title="拖动改变宽高" onPointerDown={e=>startPointer(e,'resize')}/>
    </div>}
    <aside className="fixed z-[95] bottom-16 left-3 w-[min(320px,calc(100vw-24px))] max-h-[min(65dvh,520px)] overflow-y-auto bg-[var(--theme-surface)]/95 backdrop-blur-md border border-[var(--theme-border)] rounded-2xl shadow-xl p-3 text-[var(--theme-text)] text-xs" onPointerDown={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between gap-2"><strong>布局设计 · {isMobilePreview()?'手机':'电脑'}</strong><div className="flex gap-2"><button onClick={()=>setExpanded(v=>!v)}>{expanded?'收起':'高级'}</button><button onClick={onClose}>关闭 ×</button></div></div>
      <div className="mt-2 flex gap-2 items-center"><select className="min-w-0 flex-1 border rounded-lg p-2 bg-white" value={selected} onChange={e=>setSelected(e.target.value)}>{EDITABLE_AREAS.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select><button className="border rounded-lg p-2" onClick={()=>{element(selected,{x:0,y:0,width:null,height:null});setLocked(false)}}>重置此框</button></div>
      <p className="text-[var(--theme-muted)] mt-1">编辑器快捷键：Ctrl + Shift + L。手机预览请调整独立窗口宽度，页面缩放不等于设备尺寸。</p>
      <p className="text-[var(--theme-muted)] mt-1">选中组件后，拖动绿色标签移动；拖右下角改变宽高。编辑器不再覆盖主画面。</p>
      <div className="grid grid-cols-4 gap-1 mt-2">{(['x','y','width','height'] as const).map(k=><label key={k} className="min-w-0">{k}<input type="number" disabled={locked} className="w-full border rounded px-1 py-1 bg-white" placeholder="自动" value={current[k]??''} onChange={e=>element(selected,{[k]:e.target.value===''?null:Number(e.target.value)})}/></label>)}</div>
      <div className="flex flex-wrap gap-2 mt-2"><button className="bg-[var(--theme-primary)] text-white rounded-lg px-2 py-2" onClick={save}>保存并锁定</button><button className="border rounded-lg px-2 py-2" onClick={()=>setLocked(false)}>解锁</button><button className="border rounded-lg px-2 py-2" onClick={()=>download(value)}>导出布局</button></div>
      {!isMobilePreview()&&<button className="mt-2 border rounded-lg px-2 py-1" onClick={()=>{const bridge=(window as any).englishBlocksDiskSave;if(bridge?.openMobilePreview)void bridge.openMobilePreview();else window.open(`${window.location.pathname}?layoutDev=1&mobilePreview=1`,'eb-mobile-preview','width=420,height=820')}}>打开独立手机预览</button>}
      {expanded&&<div className="border-t mt-3 pt-2 space-y-2">
        {([['pageWidth','页面最大宽度',400,2200],['sidebarWidth','侧栏宽度',120,550],['gap','两栏间距',0,90]] as const).map(([key,label,min,max])=><label key={key} className="block">{label}：{value[key]}px<input className="w-full" type="range" min={min} max={max} disabled={locked} value={value[key]} onChange={e=>update({[key]:Number(e.target.value)})}/></label>)}
        {(['sidebar','progress','board'] as const).map(id=><div key={id} className="flex gap-2 items-center"><span className="w-20">{id}缩放</span><input type="range" min="50" max="150" disabled={locked} value={value[id].scale} onChange={e=>update({[id]:{...value[id],scale:Number(e.target.value)}})}/><span>{value[id].scale}%</span></div>)}
        <button className="border rounded-lg px-2 py-1" onClick={()=>{onChange(starter());setLocked(false)}}>恢复初始布局</button>
      </div>}
    </aside>
  </>;
}
