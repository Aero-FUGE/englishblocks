import { ModalOverlay } from './ModalOverlay';
import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Gift, RotateCcw, Save, Sparkles, X } from 'lucide-react';
import { SHOP_ITEMS, CatId, OutfitSlot, ShopItem } from '../data/catShop';
import { PoseDressedCat, type CatExpression, type CatPose, POSE_UNLOCK_TIER } from './PoseDressedCat';

export interface CatCollection {
  fish:number;
  studyTasks?: import('../utils/studyTasks').StudyTaskProgress;
  activeCat:CatId;
  owned:string[];
  equipped:Record<CatId,Partial<Record<OutfitSlot,string>>>;
  bestHints:Record<string,number>;
  poses?: Record<CatId, CatPose>;
  expressions?: Record<CatId, CatExpression>;
}

export const EMPTY_COLLECTION:CatCollection={
  fish:0,
  activeCat:'mimi',
  owned:[],
  equipped:{mimi:{},tuanzhang:{}},
  bestHints:{},
  poses:{mimi:'peek',tuanzhang:'peek'},
  expressions:{mimi:'smile',tuanzhang:'smile'},
};

const CATS:CatId[]=['mimi','tuanzhang'];
const slots:{id:OutfitSlot|'all';label:string}[]=[{id:'hat',label:'帽子'},{id:'glasses',label:'眼镜'},{id:'bow',label:'领结'},{id:'clothes',label:'衣服'},{id:'accessory',label:'饰品'},{id:'all',label:'全部'}];
const collections=[{id:'pirate',name:'海盗船长套装'},{id:'princess',name:'公主礼服套装'},{id:'magic',name:'魔法学院套装'},{id:'academy',name:'学院翻译官套装'},{id:'travel',name:'旅途花园套装'}];
const poseOptions:{id:CatPose;label:string;desc:string}[]=[
  {id:'peek',label:'探头',desc:'适合翻译官窗口'},
  {id:'half',label:'半身',desc:'露出上半身穿搭'},
  {id:'stand',label:'全身站立',desc:'完整展示衣服版型'},
];
const expressionOptions:{id:CatExpression;label:string}[]=[
  {id:'smile',label:'开心'},
  {id:'focus',label:'专注'},
  {id:'proud',label:'得意'},
  {id:'shy',label:'害羞'},
];

const CatPreview:React.FC<{
  cat:CatId;items:Partial<Record<OutfitSlot,string>>;selected:boolean;onClick:()=>void;
  pose:CatPose; expression:CatExpression;
}> = ({cat,items,selected,onClick,pose,expression}) => <button onClick={onClick} className={'flex flex-col items-center gap-1 rounded-2xl p-2 transition '+(selected?'bg-[var(--theme-muted-surface)] ring-2 ring-[var(--theme-border-strong)]':'hover:bg-[var(--theme-muted-surface)]')}>
 <PoseDressedCat cat={cat} items={items} pose={pose} expression={expression} size={64} className="max-w-full"/>
 <span className={'text-sm font-bold px-3 py-1 rounded-full '+(selected?'bg-[var(--theme-muted-surface)] text-[var(--theme-text)]':'bg-white text-[var(--theme-text)]')}>{cat==='mimi'?'咪咪 ♀':'团长 ♂'}</span></button>;


const ItemPreviewCard:React.FC<{
  item:ShopItem;
  has:boolean;
  isEquipped:boolean;
  locked:boolean;
  onClick:()=>void;
}> = ({item,has,isEquipped,locked,onClick}) => {
  return <button onClick={onClick} className={'rounded-2xl border p-2 flex flex-col items-center min-w-0 transition hover:-translate-y-0.5 hover:shadow-md '+(isEquipped?'border-[var(--theme-border-strong)] bg-[var(--theme-muted-surface)]':'border-[var(--theme-border)] bg-[var(--theme-muted-surface)]')}>
    <div className="w-full aspect-square max-h-[80px] flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[var(--theme-muted-surface)] to-[var(--theme-muted-surface)]">
      <img src={`./assets/shop-thumbs/${item.id}.png?v=21`} alt="" className="w-full h-full object-contain" draggable={false}/>
    </div>
    <span className="text-xs sm:text-sm font-bold truncate max-w-full">{item.name}</span>
    <span className={'text-xs mt-1 rounded-full px-2 py-0.5 '+(locked?'bg-[var(--theme-muted-surface)] text-[var(--theme-muted)]':isEquipped?'bg-[var(--theme-muted-surface)] text-[var(--theme-text)]':has?'text-[var(--theme-muted)]':'bg-[var(--theme-muted-surface)] text-[var(--theme-text)]')}>{locked?'尚未解锁':isEquipped?'✓ 已穿戴':has?'已拥有':`${item.price} 小鱼干`}</span>
  </button>;
};

export const CatWardrobeModal:React.FC<{open:boolean;onClose:()=>void;collection:CatCollection;setCollection:React.Dispatch<React.SetStateAction<CatCollection>>;unlockedTier:number}>=({open,onClose,collection,setCollection,unlockedTier})=>{
 const [preview,setPreview]=useState<Partial<Record<OutfitSlot,string>>|null>(null);
 const [slot,setSlot]=useState<OutfitSlot|'all'>('clothes');
 const [page,setPage]=useState(0);
 const [mode,setMode]=useState<'single'|'sets'>('single');
 const [notice,setNotice]=useState('');
 const cat=collection.activeCat;
 const owned=useMemo(()=>new Set([...collection.owned,'green-beret','green-bow']),[collection.owned]);
 const items=SHOP_ITEMS.filter(x=>x.cats.includes(cat)&&(slot==='all'||x.slot===slot));
 const pageCount=Math.max(1,Math.ceil(items.length/10));
 const visible=items.slice(Math.min(page,pageCount-1)*10,(Math.min(page,pageCount-1)+1)*10);
 const equipped=collection.equipped?.[cat]||{};
 const pose = (collection.poses?.[cat] === 'sit' ? 'half' : collection.poses?.[cat]) ?? 'peek';
 const expression = collection.expressions?.[cat] ?? 'smile';
 const setPose = (next:CatPose) => setCollection(prev=>({...prev,poses:{...(prev.poses||EMPTY_COLLECTION.poses!),[cat]:next}}));
 const setExpression = (next:CatExpression) => setCollection(prev=>({...prev,expressions:{...(prev.expressions||EMPTY_COLLECTION.expressions!),[cat]:next}}));
 const previewItem=(item:ShopItem)=>{
  const current=preview||equipped;
  setPreview({...current,[item.slot]:current[item.slot]===item.id?undefined:item.id});
  setNotice(owned.has(item.id)?'试穿中，点击「保存装扮」确认穿戴。':'免费试穿中！喜欢再购买，未购买的装扮不会保存。');
 };
 const purchasePreview=()=>{
  const selection=preview||equipped;
  const wanted=Object.values(selection).filter((id):id is string=>!!id);
  const missing=SHOP_ITEMS.filter(i=>wanted.includes(i.id)&&!owned.has(i.id));
  const total=missing.reduce((sum,i)=>sum+i.price,0);
  if(missing.some(i=>i.unlockTier>unlockedTier)){setNotice('部分装扮还未解锁学习阶段');return;}
  if(total>collection.fish){setNotice(`试穿不收费！购买还差 ${total-collection.fish} 条小鱼干。`);return;}
  setCollection(p=>({...p,fish:p.fish-total,owned:[...new Set([...p.owned,...missing.map(i=>i.id)])],equipped:{...p.equipped,[cat]:selection}}));
  setPreview(null);setNotice(total?`购买并保存成功！消耗 ${total} 条小鱼干`:'搭配已保存！');
 };
 if(!open)return null;
 return <ModalOverlay className="fixed inset-0 z-[80] bg-[var(--theme-text)]/50 backdrop-blur-[5px] flex items-center justify-center p-3 sm:p-5" onClick={onClose}>
 <section role="dialog" aria-modal="true" aria-label="咪咪衣柜" className="eb-modal-panel eb-modal-wardrobe w-full max-w-[1240px] max-h-[94vh] overflow-y-auto bg-[var(--theme-surface)] border-2 border-white shadow-2xl rounded-[30px] p-4 sm:p-6 text-[var(--theme-text)]" onClick={e=>e.stopPropagation()}>
 <header className="flex flex-wrap items-center gap-3 justify-between border-b border-[var(--theme-border)] pb-4 mb-4"><h2 className="text-2xl font-bold tracking-wider">咪咪衣柜 <span className="text-[var(--theme-muted)]">♡</span></h2><div className="flex items-center gap-2"><button onClick={()=>setMode('single')} className={'rounded-full px-4 py-2 text-sm font-bold '+(mode==='single'?'bg-[var(--theme-primary)] text-white':'bg-white border border-[var(--theme-border)]')}>单品装扮</button><button onClick={()=>setMode('sets')} className={'rounded-full px-4 py-2 text-sm font-bold '+(mode==='sets'?'bg-[var(--theme-primary)] text-white':'bg-white border border-[var(--theme-border)]')}>套装组合</button></div><div className="flex items-center gap-2"><span className="rounded-full bg-white border border-[var(--theme-border)] px-4 py-2 text-sm font-bold text-[var(--theme-text)]">🐟 {collection.fish} 小鱼干</span><button aria-label="关闭衣柜" onClick={onClose} className="p-2 rounded-full bg-white hover:bg-[var(--theme-muted-surface)]"><X size={20}/></button></div></header>
 <div className="eb-modal-body eb-wardrobe-body"><div className="eb-wardrobe-grid grid grid-cols-1 gap-4">
 <div className="min-w-0">
 <div className="bg-white/80 rounded-[24px] border border-[var(--theme-border)] p-4 mb-4">
  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
    <div>
      <div className="text-base font-bold">姿态与表情</div>
      <div className="text-xs text-[var(--theme-muted)]">透明 PNG 底图＋独立服装图层，穿搭和主页悬浮翻译官实时同步。</div>
    </div>
    <div className="rounded-full bg-[var(--theme-muted-surface)] px-3 py-1 text-xs font-bold text-[var(--theme-text)]">当前：{cat==='mimi'?'咪咪':'团长'} · {poseOptions.find(x=>x.id===pose)?.label} · {expressionOptions.find(x=>x.id===expression)?.label}</div>
  </div>
  <div className="eb-wardrobe-poses grid md:grid-cols-2 gap-4 items-start">
    <div>
      <div className="text-sm font-bold mb-2">姿态成长路线</div>
      <div className="grid grid-cols-3 gap-2">
      {poseOptions.map(p=>{const locked=unlockedTier<POSE_UNLOCK_TIER[p.id];const active=pose===p.id;return <button key={p.id} onClick={()=>{if(locked)return;setPose(p.id);setNotice(locked?'该姿态尚未解锁':`${p.label}姿态已切换`);}} className={'rounded-2xl border p-3 text-left transition '+(active?'border-[var(--theme-border-strong)] bg-[var(--theme-muted-surface)]':'border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-muted-surface)]')+(locked?' opacity-55 grayscale cursor-not-allowed':'')}>
        <div className="flex items-center justify-between gap-2"><span className="font-bold text-sm">{p.label}</span><span className="text-[11px] rounded-full px-2 py-0.5 bg-[var(--theme-muted-surface)] text-[var(--theme-text)]">Lv.{POSE_UNLOCK_TIER[p.id]}</span></div>
        <div className="mt-2 flex justify-center"><PoseDressedCat cat={cat} items={preview||equipped} pose={p.id} expression={expression} size={64} showGround={false}/></div>
        <div className="text-[11px] text-[var(--theme-muted)] mt-1">{locked?'尚未解锁':p.desc}</div>
      </button>})}
      </div>
    </div>
    <div>
      <div className="text-sm font-bold mb-2">表情切换</div>
      <div className="grid grid-cols-2 gap-2">
        {expressionOptions.map(exp => <button key={exp.id} onClick={()=>{setExpression(exp.id);setNotice(`已切换到「${exp.label}」表情`);}} className={'rounded-xl border px-3 py-2 text-sm font-semibold transition '+(expression===exp.id?'border-[var(--theme-border-strong)] bg-[var(--theme-muted-surface)] text-[var(--theme-text)]':'border-[var(--theme-border)] bg-white hover:bg-[var(--theme-muted-surface)]')}>{exp.label}</button>)}
      </div>
      <div className="mt-3 rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 text-[12px] text-[var(--theme-muted)] leading-relaxed">
        后续再画：坐姿、走路、挥爪、背影、睡觉，以及限定主题动作。
      </div>
    </div>
  </div>
 </div>
 {mode==='single'?<><div className="flex flex-wrap gap-2 mb-4">{slots.map(s=><button key={s.id} onClick={()=>{setSlot(s.id);setPage(0);setNotice('')}} className={'rounded-full px-4 py-2 text-sm font-semibold border transition '+(slot===s.id?'bg-[var(--theme-primary)] text-white border-[var(--theme-border-strong)]':'bg-white border-[var(--theme-border)] hover:bg-[var(--theme-muted-surface)]')}>{s.label}</button>)}</div>
 <div className="bg-[var(--theme-surface)] rounded-[25px] border border-[var(--theme-border)] p-3 sm:p-4"><div className="mb-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-xs text-[var(--theme-muted)]">商品仅展示独立单品，点击后在右侧查看当前姿态的穿戴效果。</div><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">{visible.map(item=>{const has=owned.has(item.id),isEquipped=(preview||equipped)[item.slot]===item.id,locked=item.unlockTier>unlockedTier;return <ItemPreviewCard key={item.id} item={item} has={has} isEquipped={isEquipped} locked={locked} onClick={()=>previewItem(item)}/>})}</div><div className="flex justify-center items-center gap-6 pt-4 text-[var(--theme-muted)]"><button disabled={page===0} onClick={()=>setPage(x=>x-1)} className="p-2 rounded-full border disabled:opacity-30"><ChevronLeft size={18}/></button><span className="text-sm font-bold">{Math.min(page,pageCount-1)+1} / {pageCount}</span><button disabled={page>=pageCount-1} onClick={()=>setPage(x=>x+1)} className="p-2 rounded-full border disabled:opacity-30"><ChevronRight size={18}/></button></div></div></>:<div className="grid sm:grid-cols-2 gap-3">{collections.map(set=>{const parts=SHOP_ITEMS.filter(i=>i.collection===set.id);const count=parts.filter(i=>owned.has(i.id)).length;return <div key={set.id} className="bg-white rounded-2xl border border-[var(--theme-border)] p-4"><div className="flex gap-1 h-24 justify-center">{parts.slice(0,3).map(i=><img key={i.id} src={`./assets/shop-thumbs/${i.id}.png`} alt="" className="w-1/3 object-contain"/>)}</div><h3 className="font-bold text-center">{set.name}</h3><p className="text-center text-sm text-[var(--theme-muted)] mt-1">已收集 {count}/{parts.length} 件</p><div className="h-2 bg-[var(--theme-muted-surface)] rounded-full mt-3 overflow-hidden"><div className="h-full bg-[var(--theme-primary)]" style={{width:`${100*count/parts.length}%`}}/></div><button onClick={()=>{setMode('single');setSlot('all');setPage(0);setNotice(`可以在全部单品里收集「${set.name}」的装备`)}} className="w-full mt-3 text-sm text-[var(--theme-text)] font-semibold">查看单品</button></div>})}</div>}
 <div className="mt-4 bg-white/75 rounded-2xl border border-[var(--theme-border)] p-4"><div className="flex items-center gap-2 font-bold mb-3"><Gift size={18} className="text-[var(--theme-muted)]"/>套装推荐 <span className="text-xs font-normal text-[var(--theme-muted)]">集齐主题装扮，解锁未来限定奖励</span></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-2">{collections.slice(0,3).map(s=>{const its=SHOP_ITEMS.filter(i=>i.collection===s.id);return <button key={s.id} onClick={()=>{setMode('sets')}} className="flex items-center gap-2 bg-[var(--theme-muted-surface)] border border-[var(--theme-border)] rounded-xl p-2 text-left"><img src={`./assets/shop-thumbs/${its[0].id}.png?v=21`} alt="" className="w-12 h-12 shrink-0 object-contain"/><span className="text-sm font-bold">{s.name}<span className="block text-xs font-normal text-[var(--theme-muted)]">{its.filter(i=>owned.has(i.id)).length}/{its.length} 件</span></span></button>})}</div></div>
 </div>
 <aside className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[25px] p-4 flex flex-col"><h3 className="font-bold text-lg mb-3">穿戴预览 · 姿态成长版</h3><div className="mb-3 rounded-[22px] border border-[var(--theme-border)] bg-gradient-to-b from-[var(--theme-muted-surface)] via-[var(--theme-muted-surface)] to-[var(--theme-muted-surface)] flex flex-col items-center py-2"><PoseDressedCat cat={cat} items={preview||equipped} pose={pose} expression={expression} size={128}/><span className="text-xs font-bold text-[var(--theme-muted)]">{cat==='mimi'?'咪咪':'团长'}的试穿效果</span><span className="mt-1 text-[11px] text-[var(--theme-muted)]">保存后会自动同步到主页悬浮翻译官</span></div><div className="grid grid-cols-2 gap-2">{CATS.map(id=><CatPreview key={id} cat={id} selected={cat===id} items={id===cat?(preview||equipped):(collection.equipped?.[id]||{})} pose={collection.poses?.[id] ?? 'peek'} expression={collection.expressions?.[id] ?? 'smile'} onClick={()=>{setPreview(null);setCollection(p=>({...p,activeCat:id}));setNotice('')}}/>)}</div><div className="border-t border-[var(--theme-border)] mt-4 pt-3"><h4 className="font-bold text-sm mb-2">当前搭配（{cat==='mimi'?'咪咪':'团长'}）</h4><div className="grid grid-cols-5 gap-1.5">{slots.filter(s=>s.id!=='all').map(s=>{const item=SHOP_ITEMS.find(x=>x.id===(preview||equipped)[s.id as OutfitSlot]);return <button key={s.id} title={item?`脱下${item.name}`:`${s.label}：未穿戴`} onClick={()=>{if(!item)return;setPreview({...preview||equipped,[s.id]:undefined});}} className="aspect-square border border-dashed border-[var(--theme-border)] rounded-xl flex items-center justify-center bg-[var(--theme-muted-surface)]">{item?<img src={`./assets/shop-thumbs/${item.id}.png?v=21`} alt="" className="w-full h-full object-contain" draggable={false}/>:<span className="text-[10px] text-[var(--theme-muted)]">{s.label}</span>}</button>})}</div></div><div className="mt-auto pt-4 space-y-2"><p className="min-h-8 text-xs text-[var(--theme-muted)]">{notice||'单品免费试穿；确认购买后才扣小鱼干。姿态与表情会单独保存，后续可继续扩展更多动作。'}</p><button onClick={purchasePreview} className="w-full rounded-full bg-[var(--theme-primary)] text-white font-bold py-3 flex items-center justify-center gap-2 hover:bg-[var(--theme-primary)]"><Save size={17}/>确认购买 / 保存装扮</button><button onClick={()=>{setPreview({});setNotice('预览已卸下全部，点击保存确认')}} className="w-full flex items-center justify-center gap-1 text-sm text-[var(--theme-muted)] py-2"><RotateCcw size={14}/>卸下全部</button></div></aside>
 </div><footer className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--theme-muted)]"><span>已收藏 {owned.size}/{SHOP_ITEMS.length} 件</span><span>·</span><span>小鱼干通过拼句通关获得</span><span>·</span><span>姿态会随学习阶段逐步解锁</span><span>·</span><span>当前已支持：探头 / 半身 / 全身站立</span><span>·</span><span>衣柜 V20 · 20款新帽</span><span className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-muted-surface)] px-2 py-1 text-[var(--theme-text)]"><Sparkles size={12}/>下一步可继续加：坐姿、背影、走路、限定表情</span></footer></div>
 </section></ModalOverlay>;
};
