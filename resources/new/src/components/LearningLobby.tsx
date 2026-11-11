import {StageEmblem} from './StageEmblem';
import React,{useState} from 'react';
import {BookOpen,ChevronRight,ChevronDown,ChartNoAxesColumn,House,Music,Cloud,Settings,UserRound,Palette,Leaf,Layers,Check} from 'lucide-react';
import {SeasonDialog} from './SeasonPicker';
import {BgmPlayerWidget} from './BgmPlayerWidget';
import {DressedCat} from './DressedCat';
import type {CatCollection} from './CatWardrobeModal';
import {useSeasonTheme,SEASON_LABELS} from '../utils/seasonTheme';
import {LEARNING_STAGES} from '../utils/stages';
type Action={label:string;icon:string;onClick:()=>void;detail?:string};
const imageIcons:Record<string,string>={'小猫衣柜':'wardrobe','好友小窝':'prank'};
const icons:Record<string,React.ElementType>={'学习进度':ChartNoAxesColumn,'好友小窝':House,'音乐设置':Music,'云端存档':Cloud,'游戏设置':Settings};
export function LearningLobby({name,collection,level,tier,completed,total,words,filled,expected,onContinue,actions}:{name:string;collection:CatCollection;level:number;tier:number;completed:number;total:number;words:number;filled:number;expected:number;onContinue:()=>void;actions:Action[]}){
 const[season]=useSeasonTheme();const[showSeasons,setShowSeasons]=useState(false);
 const choose=actions.find(a=>a.label==='关卡选择')!;const stats=actions.find(a=>a.label==='学习进度')!;
 const stage=LEARNING_STAGES.find(s=>s.tier===tier)||LEARNING_STAGES[0];const catName=collection.activeCat==='mimi'?'咪咪':'团长';
 return <main className="eb-learning-lobby eb-lobby-garden" aria-label="学习大厅" style={{'--lobby-art':`url("${new URL(`./assets/lobby/${season}.png`,document.baseURI).href}")`} as React.CSSProperties}>
  <div className="eb-garden-content">
   <header className="eb-garden-header"><div className="eb-garden-brand"><img src="./apple-touch-icon.png" alt="英语拼块"/><div><h1>英语拼块 <Leaf size={15}/></h1><small>WORD BLOCK GARDEN</small></div></div><button onClick={choose.onClick} className="eb-garden-level"><StageEmblem tier={tier} size={32}/><span><small>{stage.label}</small><strong>第 {level} 关</strong></span><ChevronDown size={16}/></button></header>
   <section className="eb-garden-profile" aria-label="学习进度">
    <div className="eb-garden-profile-top"><button className="eb-garden-avatar" aria-label="打开个人档案" onClick={stats.onClick}><DressedCat cat={collection.activeCat} emotion="happy" items={collection.equipped?.[collection.activeCat]||{}} pose={collection.poses?.[collection.activeCat]||'peek'} expression={collection.expressions?.[collection.activeCat]||'smile'} size={68}/></button><div className="eb-garden-person"><strong>{name}<span>学习花园的小主人</span></strong><progress max={total} value={completed}/><small>已走过 {completed} 关 · 每一步都算数</small></div><span className="eb-garden-fish">🐟 {collection.fish}</span></div>
    <div className="eb-garden-stats"><div><BookOpen/><span>拼句通关</span><strong>{completed}<small> / {total} 句</small></strong></div><div><Leaf/><span>掌握词汇</span><strong>{words}<small> 词</small></strong></div><div><Layers/><span>当前拼放</span><strong>{filled}<small> / {expected} 块</small></strong></div></div>
   </section>
   <button className="eb-garden-save" onClick={onContinue}><span className="eb-garden-save-icon"><Check size={20}/></span><strong>学习现场已保留</strong><span>接着拼第 {level} 关</span><ChevronRight size={17}/></button>
   <section className="eb-garden-scene" aria-label="小猫陪伴"><div className="eb-garden-bubble"><small>{catName}：</small><p>今天也来拼句子吧？<br/>我在花园里等你哦 ♡</p></div></section>
   <div className="eb-garden-journey"><button className="eb-lobby-continue" onClick={onContinue}><BookOpen size={34}/><span><strong>继续学习 <ChevronRight size={23}/></strong><small>第 {level} 关 · {filled?'恢复刚才的拼法':'开始今天的小挑战'}</small></span></button><button className="eb-garden-choose" onClick={choose.onClick}><Layers size={20}/>关卡选择<ChevronRight size={18}/></button></div>
   <section className="eb-lobby-actions eb-garden-actions" aria-label="大厅功能">{['学习进度','小猫衣柜','好友小窝','音乐设置','云端存档','游戏设置'].map(label=>actions.find(a=>a.label===label)!).map(a=>{const Icon=icons[a.label]||House;return <button key={a.label} className={imageIcons[a.label]?'eb-garden-art-button':undefined} onClick={a.onClick} title={a.detail}><>{imageIcons[a.label]?<img className="eb-garden-action-art" src={`./assets/lobby-icons/${imageIcons[a.label]}.png`} alt="" aria-hidden="true" draggable={false}/>:<Icon size={28} strokeWidth={1.7}/>}</><strong>{a.label}</strong>{a.detail?.includes('来信')&&<small>{a.detail}</small>}</button>;})}<button onClick={stats.onClick}><UserRound size={28} strokeWidth={1.7}/><strong>个人档案</strong></button><button aria-expanded={showSeasons} onClick={()=>setShowSeasons(v=>!v)}><Palette size={28} strokeWidth={1.7}/><strong>四季主题</strong></button></section>
   <footer className="eb-garden-footer"><span>{SEASON_LABELS[season]} · 学习大厅</span><BgmPlayerWidget/></footer>
   {showSeasons&&<SeasonDialog onClose={()=>setShowSeasons(false)}/>}
  </div>
 </main>;
}
