import {SeasonPicker} from './SeasonPicker';
import React from 'react';
import {BgmPlayerWidget} from './BgmPlayerWidget';
import {DressedCat} from './DressedCat';
import type {CatCollection} from './CatWardrobeModal';
type Action={label:string;icon:string;onClick:()=>void;detail?:string};
export function LearningLobby({name,collection,level,completed,total,words,onContinue,actions}:{name:string;collection:CatCollection;level:number;completed:number;total:number;words:number;onContinue:()=>void;actions:Action[]}){
 return <main className="eb-learning-lobby" aria-label="学习大厅">
  <header className="eb-lobby-heading"><div><small>ENGLISHBLOCKS · 你的学习花园</small><h1>学习大厅</h1></div><span>🐟 {collection.fish} 小鱼干</span></header>
  <section className="eb-lobby-welcome"><div className="eb-lobby-cat"><DressedCat cat={collection.activeCat} emotion="happy" items={collection.equipped?.[collection.activeCat]||{}} pose={collection.poses?.[collection.activeCat]||'peek'} expression={collection.expressions?.[collection.activeCat]||'smile'} size={200}/></div><div><p>欢迎回来，{name} ♡</p><h2>今天也一起拼出<br/>一点点进步吧。</h2><p className="eb-lobby-muted">当前第 {level} 关 · 未拼完的词块已经替你留好</p><button className="eb-lobby-continue" onClick={onContinue}>继续学习 · 第 {level} 关 →</button></div></section>
  <section className="eb-lobby-progress" aria-label="学习进度"><div><strong>学习进度</strong><span>已完成 {completed} / {total} 关 · 掌握 {words} 个词</span></div><progress max={total} value={completed}/></section>
  <section className="eb-lobby-actions" aria-label="大厅功能">{actions.map(a=><button key={a.label} onClick={a.onClick}><span aria-hidden="true">{a.icon}</span><strong>{a.label}</strong>{a.detail&&<small>{a.detail}</small>}</button>)}</section>
  <section className="eb-lobby-music" aria-label="背景音乐"><strong>背景音乐</strong><BgmPlayerWidget/></section>
  <SeasonPicker/>
 </main>;
}
